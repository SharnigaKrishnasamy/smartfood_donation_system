"""File upload helpers: extension validation and safe saving to disk."""

import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app


def allowed_file(filename):
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in current_app.config["ALLOWED_IMAGE_EXTENSIONS"]


def save_image(file_storage, subfolder):
    """
    Save an uploaded image under uploads/<subfolder>/ with a random,
    collision-proof filename. Returns the relative path to store in the DB,
    e.g. "donations/8f3a1c2e9b.jpg".
    """
    if not file_storage or file_storage.filename == "":
        return None

    if not allowed_file(file_storage.filename):
        raise ValueError("File type not allowed. Use png, jpg, jpeg, or webp.")

    ext = secure_filename(file_storage.filename).rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"

    folder_map = {
        "donations": current_app.config["DONATION_IMAGES_FOLDER"],
        "profiles": current_app.config["PROFILE_IMAGES_FOLDER"],
    }
    target_dir = folder_map.get(subfolder)
    if target_dir is None:
        raise ValueError("Invalid upload subfolder")

    os.makedirs(target_dir, exist_ok=True)
    filepath = os.path.join(target_dir, filename)
    file_storage.save(filepath)

    return f"{subfolder}/{filename}"


def delete_image(relative_path):
    """Best-effort delete of an uploaded image; never raises."""
    if not relative_path:
        return
    try:
        full_path = os.path.join(current_app.config["UPLOAD_FOLDER"], relative_path)
        if os.path.isfile(full_path):
            os.remove(full_path)
    except OSError:
        pass
