import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface CelebrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// Generate confetti particles
const generateConfetti = () => {
  return Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 2 + Math.random() * 0.5,
    rotation: Math.random() * 360,
  }));
};

export default function CelebrationPopup({ isOpen, onClose }: CelebrationPopupProps) {
  const [confetti, setConfetti] = useState(generateConfetti());

  useEffect(() => {
    if (isOpen) {
      setConfetti(generateConfetti());
      const timer = setTimeout(onClose, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]"
    >
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: "-10px",
          }}
          animate={{
            y: window.innerHeight + 20,
            x: (Math.random() - 0.5) * 100,
            rotate: particle.rotation,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeIn",
          }}
        />
      ))}

      {/* Center celebration message */}
      <motion.div
        className="absolute bg-white rounded-lg shadow-2xl p-8 text-center pointer-events-auto"
        initial={{ scale: 0, y: 0 }}
        animate={{ scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: 1, delay: 0.2 }}
          className="mb-4"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <motion.div
              animate={{ scale: [0, 1] }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-800 mb-2"
        >
          User Created! 🎉
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600"
        >
          New user added successfully
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
