import React from 'react';
import { Github, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-black/20 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-sm text-white/50 text-center md:text-left">
            <p>© {new Date().getFullYear()} Forsightt. All rights reserved.</p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <motion.a
              href="https://github.com/MarcusMore/ArcPrediction"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition-all duration-300 group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="GitHub"
            >
              <Github 
                size={20} 
                className="text-white/60 group-hover:text-primary transition-colors" 
              />
            </motion.a>
            
            <motion.a
              href="https://x.com/MarcusMore_"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition-all duration-300 group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="X (Twitter)"
            >
              <Twitter 
                size={20} 
                className="text-white/60 group-hover:text-primary transition-colors" 
              />
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
};

