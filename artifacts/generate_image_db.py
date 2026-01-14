#!/usr/bin/env python3
"""
Generate a SQLite database for testing image hosting (图床) functionality.
Fetches random images from https://picsum.photos API.
"""

import sqlite3
import urllib.request
import json
import os
import random
import hashlib
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
DB_PATH = Path(__file__).parent / "image_gallery.db"
NUM_PAGES = 3  # Number of pages to fetch (30 images per page by default)
IMAGES_PER_PAGE = 100

def fetch_images(page: int = 1, limit: int = IMAGES_PER_PAGE) -> list:
    """Fetch image list from picsum.photos API."""
    url = f"https://picsum.photos/v2/list?page={page}&limit={limit}"
    print(f"Fetching images from {url}")
    
    with urllib.request.urlopen(url, timeout=30) as response:
        data = json.loads(response.read().decode())
    return data

def generate_random_tags() -> str:
    """Generate random tags for images."""
    all_tags = [
        "nature", "landscape", "architecture", "portrait", "street",
        "travel", "food", "animals", "city", "night", "sunset", "sunrise",
        "beach", "mountain", "forest", "urban", "minimal", "abstract",
        "vintage", "modern", "colorful", "black-and-white", "macro", "aerial"
    ]
    num_tags = random.randint(1, 5)
    return ",".join(random.sample(all_tags, num_tags))

def generate_random_datetime(days_back: int = 365) -> str:
    """Generate a random datetime within the specified days back."""
    random_days = random.randint(0, days_back)
    random_seconds = random.randint(0, 86400)
    dt = datetime.now() - timedelta(days=random_days, seconds=random_seconds)
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def generate_file_hash(image_id: str, author: str) -> str:
    """Generate a fake file hash."""
    content = f"{image_id}-{author}-{random.random()}"
    return hashlib.sha256(content.encode()).hexdigest()[:32]

def create_database():
    """Create the SQLite database with image hosting schema."""
    
    # Remove existing database
    if DB_PATH.exists():
        os.remove(DB_PATH)
        print(f"Removed existing database: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables
    cursor.executescript("""
        -- Users table
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            storage_used INTEGER DEFAULT 0,
            storage_limit INTEGER DEFAULT 5368709120,  -- 5GB default
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        );
        
        -- Albums/Folders table
        CREATE TABLE albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            cover_image_id INTEGER,
            is_public BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        -- Main images table
        CREATE TABLE images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            album_id INTEGER,
            picsum_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT,
            file_hash TEXT UNIQUE,
            mime_type TEXT DEFAULT 'image/jpeg',
            file_size INTEGER,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            author TEXT,
            title TEXT,
            description TEXT,
            alt_text TEXT,
            source_url TEXT,
            download_url TEXT,
            thumbnail_url TEXT,
            medium_url TEXT,
            tags TEXT,
            views INTEGER DEFAULT 0,
            downloads INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0,
            is_public BOOLEAN DEFAULT 1,
            is_nsfw BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
        );
        
        -- Image variants (different sizes/formats)
        CREATE TABLE image_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_id INTEGER NOT NULL,
            variant_type TEXT NOT NULL,  -- 'thumbnail', 'small', 'medium', 'large', 'original'
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            file_size INTEGER,
            url TEXT NOT NULL,
            format TEXT DEFAULT 'jpg',  -- 'jpg', 'webp', 'avif'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
        );
        
        -- Image access logs
        CREATE TABLE access_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_id INTEGER NOT NULL,
            access_type TEXT NOT NULL,  -- 'view', 'download', 'embed'
            ip_address TEXT,
            user_agent TEXT,
            referer TEXT,
            accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
        );
        
        -- API keys for external access
        CREATE TABLE api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            key_hash TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            permissions TEXT DEFAULT 'read',  -- 'read', 'write', 'admin'
            rate_limit INTEGER DEFAULT 1000,
            last_used_at DATETIME,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        -- Create indexes
        CREATE INDEX idx_images_user_id ON images(user_id);
        CREATE INDEX idx_images_album_id ON images(album_id);
        CREATE INDEX idx_images_created_at ON images(created_at);
        CREATE INDEX idx_images_is_public ON images(is_public);
        CREATE INDEX idx_images_picsum_id ON images(picsum_id);
        CREATE INDEX idx_image_variants_image_id ON image_variants(image_id);
        CREATE INDEX idx_access_logs_image_id ON access_logs(image_id);
        CREATE INDEX idx_access_logs_accessed_at ON access_logs(accessed_at);
        CREATE INDEX idx_albums_user_id ON albums(user_id);
    """)
    
    print("Database schema created successfully")
    
    # Insert sample users
    users = [
        ("admin", "admin@example.com", "Administrator", "https://picsum.photos/id/64/100/100"),
        ("john_doe", "john@example.com", "John Doe", "https://picsum.photos/id/65/100/100"),
        ("jane_smith", "jane@example.com", "Jane Smith", "https://picsum.photos/id/66/100/100"),
        ("photographer", "photo@example.com", "Pro Photographer", "https://picsum.photos/id/67/100/100"),
        ("designer", "design@example.com", "UI Designer", "https://picsum.photos/id/68/100/100"),
    ]
    
    cursor.executemany("""
        INSERT INTO users (username, email, display_name, avatar_url) 
        VALUES (?, ?, ?, ?)
    """, users)
    
    print(f"Inserted {len(users)} users")
    
    # Insert sample albums
    albums = [
        (1, "Featured", "Featured images collection", 1),
        (1, "Landscapes", "Beautiful landscape photography", 0),
        (2, "Portfolio", "My best work", 1),
        (2, "Travel", "Photos from my travels", 1),
        (3, "Nature", "Nature and wildlife", 1),
        (4, "Street", "Street photography", 1),
        (4, "Architecture", "Buildings and structures", 0),
        (5, "UI Inspiration", "Design inspiration", 0),
    ]
    
    cursor.executemany("""
        INSERT INTO albums (user_id, name, description, is_public) 
        VALUES (?, ?, ?, ?)
    """, albums)
    
    print(f"Inserted {len(albums)} albums")
    
    # Fetch and insert images
    all_images = []
    for page in range(1, NUM_PAGES + 1):
        try:
            images = fetch_images(page=page, limit=IMAGES_PER_PAGE)
            all_images.extend(images)
            print(f"Fetched {len(images)} images from page {page}")
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
    
    # Insert images
    image_records = []
    for img in all_images:
        user_id = random.randint(1, len(users))
        album_id = random.choice([None, random.randint(1, len(albums))])
        
        # Calculate estimated file size based on dimensions
        estimated_size = int(img['width'] * img['height'] * 0.3)  # Rough JPEG estimate
        
        record = (
            user_id,
            album_id,
            img['id'],
            f"picsum_{img['id']}.jpg",
            f"original_{img['id']}.jpg",
            generate_file_hash(img['id'], img['author']),
            'image/jpeg',
            estimated_size,
            img['width'],
            img['height'],
            img['author'],
            f"Photo by {img['author']}",
            f"A beautiful photo captured by {img['author']}",
            f"Photo {img['id']} by {img['author']}",
            img['url'],
            img['download_url'],
            f"https://picsum.photos/id/{img['id']}/200/200",
            f"https://picsum.photos/id/{img['id']}/800/600",
            generate_random_tags(),
            random.randint(0, 10000),
            random.randint(0, 1000),
            random.randint(0, 500),
            random.choice([0, 1, 1, 1]),  # 75% public
            0,
            generate_random_datetime(),
            generate_random_datetime(30),
        )
        image_records.append(record)
    
    cursor.executemany("""
        INSERT INTO images (
            user_id, album_id, picsum_id, filename, original_filename,
            file_hash, mime_type, file_size, width, height,
            author, title, description, alt_text, source_url,
            download_url, thumbnail_url, medium_url, tags,
            views, downloads, likes, is_public, is_nsfw,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, image_records)
    
    print(f"Inserted {len(image_records)} images")
    
    # Insert image variants
    variants = []
    variant_configs = [
        ('thumbnail', 200, 200, 'jpg'),
        ('thumbnail', 200, 200, 'webp'),
        ('small', 400, 300, 'jpg'),
        ('medium', 800, 600, 'jpg'),
        ('medium', 800, 600, 'webp'),
        ('large', 1920, 1080, 'jpg'),
    ]
    
    cursor.execute("SELECT id, picsum_id, width, height FROM images")
    images_data = cursor.fetchall()
    
    for img_id, picsum_id, orig_width, orig_height in images_data:
        for variant_type, width, height, fmt in variant_configs:
            # Adjust size to maintain aspect ratio
            actual_width = min(width, orig_width)
            actual_height = int(actual_width * orig_height / orig_width)
            
            file_size = int(actual_width * actual_height * (0.2 if fmt == 'webp' else 0.3))
            
            ext = 'webp' if fmt == 'webp' else ''
            url = f"https://picsum.photos/id/{picsum_id}/{actual_width}/{actual_height}"
            if ext:
                url += f".{ext}"
            
            variants.append((
                img_id, variant_type, actual_width, actual_height,
                file_size, url, fmt
            ))
    
    cursor.executemany("""
        INSERT INTO image_variants (
            image_id, variant_type, width, height, file_size, url, format
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, variants)
    
    print(f"Inserted {len(variants)} image variants")
    
    # Insert sample access logs
    access_logs = []
    access_types = ['view', 'view', 'view', 'download', 'embed']
    user_agents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
        'curl/7.68.0',
    ]
    referers = [
        'https://example.com',
        'https://blog.example.com',
        'https://social.example.com',
        None,
    ]
    
    for img_id, _, _, _ in images_data[:50]:  # Only first 50 images
        num_logs = random.randint(5, 50)
        for _ in range(num_logs):
            access_logs.append((
                img_id,
                random.choice(access_types),
                f"192.168.1.{random.randint(1, 255)}",
                random.choice(user_agents),
                random.choice(referers),
                generate_random_datetime(30),
            ))
    
    cursor.executemany("""
        INSERT INTO access_logs (
            image_id, access_type, ip_address, user_agent, referer, accessed_at
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, access_logs)
    
    print(f"Inserted {len(access_logs)} access logs")
    
    # Insert sample API keys
    api_keys = [
        (1, hashlib.sha256(b'admin-key-1').hexdigest(), 'Admin Key', 'admin', 10000),
        (2, hashlib.sha256(b'john-key-1').hexdigest(), 'John\'s App', 'write', 5000),
        (3, hashlib.sha256(b'jane-key-1').hexdigest(), 'Jane\'s Website', 'read', 1000),
        (4, hashlib.sha256(b'photo-key-1').hexdigest(), 'Portfolio Site', 'read', 2000),
    ]
    
    cursor.executemany("""
        INSERT INTO api_keys (user_id, key_hash, name, permissions, rate_limit)
        VALUES (?, ?, ?, ?, ?)
    """, api_keys)
    
    print(f"Inserted {len(api_keys)} API keys")
    
    # Update album cover images
    cursor.execute("""
        UPDATE albums SET cover_image_id = (
            SELECT id FROM images 
            WHERE images.album_id = albums.id 
            ORDER BY RANDOM() 
            LIMIT 1
        )
    """)
    
    # Update user storage used
    cursor.execute("""
        UPDATE users SET storage_used = (
            SELECT COALESCE(SUM(file_size), 0) 
            FROM images 
            WHERE images.user_id = users.id
        )
    """)
    
    conn.commit()
    
    # Print summary
    print("\n" + "=" * 50)
    print("Database Generation Summary")
    print("=" * 50)
    
    cursor.execute("SELECT COUNT(*) FROM users")
    print(f"Users: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM albums")
    print(f"Albums: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM images")
    print(f"Images: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM image_variants")
    print(f"Image Variants: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM access_logs")
    print(f"Access Logs: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM api_keys")
    print(f"API Keys: {cursor.fetchone()[0]}")
    
    file_size = os.path.getsize(DB_PATH)
    print(f"\nDatabase file: {DB_PATH}")
    print(f"Database size: {file_size / 1024:.2f} KB")
    
    conn.close()
    print("\nDatabase generation complete! ✨")

if __name__ == "__main__":
    create_database()
