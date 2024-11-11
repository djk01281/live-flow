import { motion } from "framer-motion";

interface CursorProps {
  x: number;
  y: number;
  color: string;
}

const Cursor = ({ x, y, color }: CursorProps) => (
  <motion.div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      zIndex: 5000,
      pointerEvents: "none",
      width: "24px",
      height: "24px",
    }}
    initial={{ x, y }}
    animate={{ x, y }}
    transition={{
      type: "spring",
      bounce: 0.6,
      damping: 30,
      mass: 0.8,
      stiffness: 350,
      restSpeed: 0.01,
    }}
  >
    <svg viewBox="0 0 94 99" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.40255 5.31234C1.90848 3.6645 3.58743 2.20312 5.15139 2.91972L90.0649 41.8264C91.7151 42.5825 91.5858 44.9688 89.8637 45.5422L54.7989 57.2186C53.3211 57.7107 52.0926 58.7582 51.3731 60.1397L33.0019 95.4124C32.1726 97.0047 29.8279 96.7826 29.3124 95.063L2.40255 5.31234Z"
        fill={color}
        stroke="black"
        strokeWidth="4"
      />
    </svg>
  </motion.div>
);

export default Cursor;
