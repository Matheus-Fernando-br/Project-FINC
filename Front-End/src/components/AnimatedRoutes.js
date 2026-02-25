import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function AnimatedRoutes({ children }) {
  const location = useLocation();

const variants = {
  enter: {
    opacity: 0,
    y: 10
  },
  center: {
    opacity: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    y: -10
  }
};

  return (
  <AnimatePresence>
    <motion.div
      key={location.pathname}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
  );
}
