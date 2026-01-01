import base64
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from config import EAR_THRESHOLD, CONSECUTIVE_FRAMES, LEFT_EYE, RIGHT_EYE
from helpers import calculate_ear


class DrowsinessDetector:
    def __init__(self):
        self.detector = self._initialize_detector()
        self.drowsy_frames = 0

    def _initialize_detector(self):
        """Initialize MediaPipe FaceLandmarker detector."""
        base_options = python.BaseOptions(
            model_asset_path="models/face_landmarker.task"
        )
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
        )
        return vision.FaceLandmarker.create_from_options(options)

    def _decode_frame(self, frame_data):
        """Decode a base64-encoded image to a BGR frame."""
        try:
            img_bytes = base64.b64decode(frame_data.split(",")[1])
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return frame
        except Exception:
            return None

    def _convert_to_rgb(self, frame):
        """Convert BGR frame to RGB for MediaPipe processing."""
        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    def _detect_face_landmarks(self, rgb_frame):
        """Run MediaPipe face landmark detection on the frame."""
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        detection_result = self.detector.detect(mp_image)
        if not detection_result.face_landmarks:
            return None
        return detection_result.face_landmarks[0]

    def _extract_eye_landmarks(self, face_landmarks, frame_shape):
        """Extract coordinates for left and right eyes."""
        h, w = frame_shape[:2]

        left_eye = np.array(
            [[face_landmarks[i].x * w, face_landmarks[i].y * h] for i in LEFT_EYE]
        )
        right_eye = np.array(
            [[face_landmarks[i].x * w, face_landmarks[i].y * h] for i in RIGHT_EYE]
        )
        return left_eye, right_eye

    def _calculate_ear(self, left_eye, right_eye):
        """Compute average Eye Aspect Ratio (EAR)."""
        left_ear = calculate_ear(left_eye)
        right_ear = calculate_ear(right_eye)
        return (left_ear + right_ear) / 2.0

    def _update_drowsiness_status(self, avg_ear):
        """Update consecutive drowsy frame count and determine drowsiness."""
        if avg_ear < EAR_THRESHOLD:
            self.drowsy_frames += 1
        else:
            self.drowsy_frames = 0
        return self.drowsy_frames >= CONSECUTIVE_FRAMES

    def _format_landmarks(self, face_landmarks):
        """Convert landmarks to frontend-friendly format."""
        return [{"x": lm.x, "y": lm.y} for lm in face_landmarks]

    def process_frame(self, frame_data):
        """Process a single frame and return drowsiness status and landmarks."""
        frame = self._decode_frame(frame_data)
        if frame is None:
            return {
                "landmarks": [],
                "ear": 0,
                "is_drowsy": False,
                "message": "Failed to decode image",
            }

        rgb_frame = self._convert_to_rgb(frame)
        face_landmarks = self._detect_face_landmarks(rgb_frame)
        if face_landmarks is None:
            return {
                "landmarks": [],
                "ear": 0,
                "is_drowsy": False,
                "message": "No face detected",
            }

        left_eye, right_eye = self._extract_eye_landmarks(face_landmarks, frame.shape)
        avg_ear = self._calculate_ear(left_eye, right_eye)
        is_drowsy = self._update_drowsiness_status(avg_ear)
        landmarks = self._format_landmarks(face_landmarks)

        return {
            "landmarks": landmarks,
            "left_eye_indices": LEFT_EYE,
            "right_eye_indices": RIGHT_EYE,
            "ear": round(avg_ear, 3),
            "is_drowsy": is_drowsy,
            "message": "DROWSY" if is_drowsy else "GOOD",
        }
