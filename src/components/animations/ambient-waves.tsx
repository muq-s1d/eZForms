"use client";

import { motion } from "framer-motion";

export function AmbientWaves() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#050505]">
      {/* 
        Hardware-Accelerated Ambient Light Trails
        Instead of animating the SVG path 'd' attributes or using expensive SVG <feGaussianBlur>,
        we use massive static SVG shapes and animate their CSS transforms (translate, rotate, scale).
        The CSS filter 'blur-3xl' forces the GPU to render the blur, guaranteeing 60fps performance 
        with zero stuttering on buttons or other animations.
      */}
      
      {/* Primary Light Flow */}
      <motion.div
        className="absolute w-[200vw] h-[200vh] -top-[50vh] -left-[50vw] opacity-[0.25] blur-3xl mix-blend-screen"
        animate={{
          rotate: [0, 3, -3, 0],
          scale: [1, 1.05, 1],
          x: [0, 60, -60, 0],
          y: [0, -40, 40, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          {/* Deep Purple Base Wave */}
          <path
            d="M-200,600 C100,400 400,800 700,500 S1000,700 1200,500"
            fill="none"
            stroke="#9C27B0"
            strokeWidth="100"
          />
          {/* Mid Blue Wave */}
          <path
            d="M-200,650 C150,450 450,750 750,550 S950,650 1200,550"
            fill="none"
            stroke="#4285F4"
            strokeWidth="50"
          />
          {/* Bright Cyan Highlight */}
          <path
            d="M-200,620 C200,420 500,820 800,520 S1050,620 1200,520"
            fill="none"
            stroke="#00BCD4"
            strokeWidth="20"
          />
          {/* White Core */}
          <path
            d="M-200,630 C180,430 480,830 780,530 S1020,630 1200,530"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="8"
            opacity="0.9"
          />
        </svg>
      </motion.div>

      {/* Secondary Counter-Flowing Light */}
      <motion.div
        className="absolute w-[200vw] h-[200vh] -top-[50vh] -left-[50vw] opacity-[0.20] blur-2xl mix-blend-screen"
        animate={{
          rotate: [0, -4, 4, 0],
          scale: [1.05, 1, 1.05],
          x: [0, -50, 50, 0],
          y: [0, 50, -50, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          {/* Purple Counter Wave */}
          <path
            d="M-200,400 C100,600 500,300 800,500 S1000,400 1200,500"
            fill="none"
            stroke="#9C27B0"
            strokeWidth="80"
          />
          {/* Blue Counter Wave */}
          <path
            d="M-200,450 C200,650 400,350 700,550 S950,450 1200,550"
            fill="none"
            stroke="#4285F4"
            strokeWidth="40"
          />
          {/* White Counter Core */}
          <path
            d="M-200,425 C150,625 450,325 750,525 S980,425 1200,525"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="6"
            opacity="0.8"
          />
        </svg>
      </motion.div>
    </div>
  );
}
