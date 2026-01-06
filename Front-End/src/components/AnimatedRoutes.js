import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function AnimatedRoutes({ children }) {
  const location = useLocation();
  const direction = location.state?.direction || "none";

  const variants = {
    enter: (dir) => ({
      rotateY: dir === "right" ? 90 : dir === "left" ? -90 : 0,
      opacity: 0
    }),
    center: {
      rotateY: 0,
      opacity: 1
    },
    exit: (dir) => ({
      rotateY: dir === "right" ? -90 : dir === "left" ? 90 : 0,
      opacity: 0
    })
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{
          transformStyle: "preserve-3d",
          perspective: 1200
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
