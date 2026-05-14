import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

const MotionDiv = motion.div;

const CartPopup = ({ show, message }) => {
  return (
    <AnimatePresence>
      {show && (
        <MotionDiv
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-10 right-10 z-50 bg-white shadow-lg border rounded-2xl flex items-center gap-3 px-5 py-3"
        >
          <CheckCircle className="text-green-600" size={24} />
          <p className="text-gray-800 font-medium">{message}</p>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default CartPopup;
