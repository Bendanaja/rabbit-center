'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface TemplateProps {
  children: ReactNode;
}

// Beautiful page transition with fade + subtle slide
export default function Template({ children }: TemplateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1], // Custom ease for smooth feel
      }}
    >
      {children}
    </motion.div>
  );
}
