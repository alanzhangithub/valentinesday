import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        // Get the list of files from the memories directory
        const response = await fetch('/api/get-photos');
        const data = await response.json();
        setPhotos(data.photos);
      } catch (error) {
        console.error('Error fetching photos:', error);
      }
    };

    fetchPhotos();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {photos.map((photo, index) => (
          <motion.div
            key={photo}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="aspect-square relative group"
          >
            <div className="w-full h-full rounded-lg overflow-hidden">
              <img
                src={`/memories/${photo}`}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;