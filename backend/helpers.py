import numpy as np


def calculate_ear(eye_points):
    """Calculate Eye Aspect Ratio"""
    # Vertical distances
    v1 = np.linalg.norm(eye_points[1] - eye_points[5])
    v2 = np.linalg.norm(eye_points[2] - eye_points[4])
    # Horizontal distance
    h = np.linalg.norm(eye_points[0] - eye_points[3])

    ear = (v1 + v2) / (2.0 * h)
    return ear
