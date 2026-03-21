import os
import shutil
from abc import ABC, abstractmethod
from fastapi import UploadFile

class StorageProvider(ABC):
    @abstractmethod
    async def save_file(self, file: UploadFile, user_id: int) -> str:
        """Сохраняет файл и возвращает путь или URL"""
        pass

class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: str = "static/avatars", base_url: str = "/static/avatars"):
        self.base_dir = base_dir
        self.base_url = base_url
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, file: UploadFile, user_id: int) -> str:
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        file_name = f"avatar_{user_id}_{os.urandom(4).hex()}.{file_extension}"
        file_path = os.path.join(self.base_dir, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Возвращаем полный URL (для локальной разработки жестко задаем localhost:8000, 
        # в проде лучше брать из конфига)
        return f"http://localhost:8000{self.base_url}/{file_name}"

class S3StorageProvider(StorageProvider):
    async def save_file(self, file: UploadFile, user_id: int) -> str:
        # TODO: Реализовать логику сохранения в S3 или другой cloud storage
        raise NotImplementedError("S3 storage is not implemented yet")

# Экземпляр по умолчанию
storage_service = LocalStorageProvider()
