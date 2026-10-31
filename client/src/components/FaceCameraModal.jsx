import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Camera, RefreshCw, CheckCircle2, ShieldAlert, X, Loader2, UserCheck } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';

const calculateEAR = (eyePoints) => {
  const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  const v1 = dist(eyePoints[1], eyePoints[5]);
  const v2 = dist(eyePoints[2], eyePoints[4]);
  const h1 = dist(eyePoints[0], eyePoints[3]);
  return (v1 + v2) / (2.0 * h1);
};

// Track model loading state globally so we don't reload on every modal open
let modelsLoaded = false;
let modelsLoading = false;

const loadFaceModels = async () => {
  if (modelsLoaded) return;
  if (modelsLoading) {
    // Wait for ongoing load
    while (modelsLoading) await new Promise((r) => setTimeout(r, 100));
    return;
  }
  modelsLoading = true;
  const MODEL_URL = '/models';
  // Optimized: Only load models we actually use for faster initialization
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Back to TinyFaceDetector for speed, but will increase inputSize
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
  ]);
  modelsLoaded = true;
  modelsLoading = false;
};

export const FaceCameraModal = ({
  isOpen,
  onClose,
  mode = 'verify', // 'register' | 'verify'
  employeeName = '',
  employeeId = '',
  onCaptureSuccess,
  isSubmitting = false
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const captureFaceRef = useRef(null);
  const isEyeClosedRef = useRef(false);
  const consecutiveOpenFramesRef = useRef(0);
  const livenessVerifiedRef = useRef(false);
  const maxEARRef = useRef(0.15);

  const [cameraError, setCameraError] = useState('');
  const [status, setStatus] = useState('loading_models'); // loading_models | initializing | scanning | face_detected | captured | error
  const [statusMsg, setStatusMsg] = useState('Loading face recognition models...');
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [computedDescriptor, setComputedDescriptor] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [faceDistance, setFaceDistance] = useState('unknown'); // 'too_close' | 'perfect' | 'too_far' | 'unknown'
  const [blinkAttemptTime, setBlinkAttemptTime] = useState(0); // Track how long user is trying

  useEffect(() => {
    if (isOpen) {
      isEyeClosedRef.current = false;
      consecutiveOpenFramesRef.current = 0;
      livenessVerifiedRef.current = false;
      maxEARRef.current = 0.15;
      setLivenessVerified(false);
      setCameraError('');
      setStatus('loading_models');
      setStatusMsg('Loading face recognition models...');
      setCapturedPreview(null);
      setComputedDescriptor(null);
      setFaceDetected(false);
      setFaceDistance('unknown');
      setBlinkAttemptTime(Date.now());
      
      initModal();
      
      return () => {
        cleanup();
      };
    } else {
      cleanup();
    }
  }, [isOpen]);

  const initModal = async () => {
    try {
      await loadFaceModels();
      setStatus('initializing');
      setStatusMsg('Starting camera...');
      await startCamera();
    } catch (err) {
      console.error('Face model load error:', err);
      setCameraError('Failed to load face recognition models. Please refresh and try again.');
      setStatus('error');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStatus('scanning');
          setStatusMsg('Align your face inside the frame');
          startFaceDetectionLoop();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Cannot access camera. Please allow camera permissions.');
      setStatus('error');
    }
  };

  const startFaceDetectionLoop = () => {
    let isDetecting = false;
    // Optimized: 250ms interval instead of 150ms for better performance
    detectionIntervalRef.current = setInterval(async () => {
      if (isDetecting) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      
      isDetecting = true;
      try {
        // Using TinyFaceDetector with inputSize 320 (instead of 224) for a good balance of speed and stability
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }) 
        ).withFaceLandmarks();

        const hasFace = !!detection;
        setFaceDetected(hasFace);
        
        if (hasFace) {
          // Calculate face size for distance guidance
          const box = detection.detection.box;
          const faceWidth = box.width;
          const videoWidth = videoRef.current.videoWidth || 640;
          const facePercentage = (faceWidth / videoWidth) * 100;
          
          // Distance guidance based on face size
          // Perfect: 25-40% of frame width
          // Too close: >40%
          // Too far: <25%
          let distanceStatus = 'unknown';
          let distanceMsg = '';
          
          if (facePercentage > 45) {
            distanceStatus = 'too_close';
            distanceMsg = '📏 Move back a little';
          } else if (facePercentage < 20) {
            distanceStatus = 'too_far';
            distanceMsg = '📏 Come closer to camera';
          } else {
            distanceStatus = 'perfect';
            distanceMsg = '✓ Perfect distance';
          }
          
          setFaceDistance(distanceStatus);
          
          if (!livenessVerifiedRef.current) {
            const landmarks = detection.landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            
            const leftEAR = calculateEAR(leftEye);
            const rightEAR = calculateEAR(rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2;
            
            // Dynamic thresholding: adapt to the user's specific eye shape and distance
            if (avgEAR > maxEARRef.current) {
              maxEARRef.current = avgEAR; // Instantly adapt to wider open eyes
            } else if (avgEAR > 0.15) {
              // Slowly decay maxEAR to account for distance changes, but don't decay during a blink
              maxEARRef.current = maxEARRef.current * 0.99 + avgEAR * 0.01;
            }
            
            // A blink is a rapid relative drop from the user's normal open eye state
            const BLINK_THRESHOLD = maxEARRef.current * 0.85; // 15% drop or less is considered open
            const BLINK_CLOSED_THRESHOLD = maxEARRef.current * 0.70; // 30% drop is considered clearly closed
            
            if (avgEAR >= BLINK_THRESHOLD) {
              // Eyes are open
              if (isEyeClosedRef.current) {
                // Blink completed - eyes were closed and now open!
                livenessVerifiedRef.current = true;
                setLivenessVerified(true);
                isEyeClosedRef.current = false;
                consecutiveOpenFramesRef.current = 0;
                setStatusMsg('Liveness verified ✓ Auto-capturing...');
                
                setTimeout(() => {
                  if (captureFaceRef.current) {
                    captureFaceRef.current();
                  }
                }, 500); // Short delay for user to open eyes fully before snap
              }
              consecutiveOpenFramesRef.current += 1;
            } else if (avgEAR <= BLINK_CLOSED_THRESHOLD) {
              // Eyes are definitely closed
              isEyeClosedRef.current = true;
              consecutiveOpenFramesRef.current = 0;
            } else {
              // Ambiguous state (between 15% and 30% drop) - don't reset counter, just wait
              // This allows smoother blink detection
            }
            
            if (!livenessVerifiedRef.current) {
              setStatusMsg(distanceStatus === 'perfect' ? 'Please BLINK to verify liveness' : distanceMsg);
            }
          } else {
            setStatusMsg(distanceStatus === 'perfect' ? 'Face detected and Liveness verified ✓' : distanceMsg);
          }
        } else {
          setStatusMsg('Align your face inside the frame');
          setFaceDistance('unknown');
          livenessVerifiedRef.current = false;
          setLivenessVerified(false);
          isEyeClosedRef.current = false;
          consecutiveOpenFramesRef.current = 0;
        }
      } catch (_) {
      } finally {
        isDetecting = false;
      }
    }, 100); // Decreased interval to 100ms to catch fast blinks
  };

  const cleanup = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    captureFaceRef.current = handleCaptureFace;
  });

  const handleCaptureFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (status === 'processing') return;

    setStatus('processing');
    setStatusMsg('Extracting face descriptor...');

    try {
      // Stop detection loop during capture
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }

      // Draw current frame to hidden canvas
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Use TinyFaceDetector for capture as well
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus('scanning');
        setStatusMsg('No face detected clearly. Please align your face and try again.');
        setFaceDetected(false);
        startFaceDetectionLoop();
        return;
      }

      // descriptor is Float32Array(128) — convert to plain array for JSON serialization
      const descriptorArray = Array.from(detection.descriptor);
      setComputedDescriptor(descriptorArray);
      setCapturedPreview(canvas.toDataURL('image/jpeg', 0.85));
      setStatus('captured');
      setStatusMsg('Face captured successfully ✓');
    } catch (err) {
      console.error('Face capture error:', err);
      setStatus('scanning');
      setStatusMsg('Capture failed. Please try again.');
      startFaceDetectionLoop();
    }
  };

  const handleConfirm = () => {
    if (computedDescriptor && onCaptureSuccess) {
      cleanup();
      onCaptureSuccess(computedDescriptor);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setComputedDescriptor(null);
    setFaceDetected(false);
    setStatus('scanning');
    setStatusMsg('Align your face inside the frame');
    startFaceDetectionLoop();
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const isLoading = status === 'loading_models' || status === 'initializing' || status === 'processing';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg" hideCloseButton={true}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {mode === 'register' ? 'Face Lock Enrolment' : 'Face Lock Verification'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {mode === 'register'
                  ? `Setting up Face Lock for ${employeeName || 'Employee'}`
                  : 'Scan your registered face to login / logout'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Viewport */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl aspect-[4/3] flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center text-rose-400 space-y-3">
              <ShieldAlert className="w-12 h-12 mx-auto stroke-[1.8]" />
              <p className="text-xs font-semibold">{cameraError}</p>
              <button
                type="button"
                onClick={initModal}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30"
              >
                Retry
              </button>
            </div>
          ) : capturedPreview ? (
            <div className="relative w-full h-full">
              <img src={capturedPreview} alt="Captured" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold bg-emerald-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/30 shadow-lg">
                  <CheckCircle2 className="w-4 h-4" /> Face Descriptor Extracted ✓
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-cyan-300 text-xs font-bold">{statusMsg}</p>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* HUD overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`w-48 h-48 sm:w-56 sm:h-56 rounded-3xl border-2 transition-colors duration-300 relative ${
                    faceDetected
                      ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)]'
                      : 'border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  {/* Corner accents */}
                  <div className={`absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-2xl ${faceDetected ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-2xl ${faceDetected ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-2xl ${faceDetected ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-2xl ${faceDetected ? 'border-emerald-400' : 'border-cyan-400'}`} />
                  {!faceDetected && <div className="animate-scan-line" />}
                </div>

                {/* Distance indicator - Top */}
                {faceDetected && faceDistance !== 'unknown' && (
                  <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full backdrop-blur-md border text-[10px] font-extrabold ${
                    faceDistance === 'perfect' 
                      ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-950/80 border-amber-500/30 text-amber-400 animate-pulse'
                  }`}>
                    {faceDistance === 'too_close' && '↔️ Move Back'}
                    {faceDistance === 'too_far' && '↔️ Come Closer'}
                    {faceDistance === 'perfect' && '✓ Perfect Distance'}
                  </div>
                )}

                {/* Status badge */}
                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full backdrop-blur-md border text-[11px] font-extrabold flex items-center gap-2 ${
                  faceDetected
                    ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900/80 border-cyan-500/30 text-cyan-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-400' : 'bg-cyan-400 animate-ping'}`} />
                  {statusMsg}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {capturedPreview ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4 stroke-[2.5]" />
                {isSubmitting ? 'Processing...' : mode === 'register' ? 'Save Face Lock' : 'Confirm & Login/Logout'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-all"
              >
                Cancel
              </button>
              {/* Manual Capture Button - Shows if blink verified */}
              {faceDetected && livenessVerified && (
                <button
                  type="button"
                  onClick={handleCaptureFace}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  Capture Now
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

