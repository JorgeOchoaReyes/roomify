/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { motion } from "framer-motion"; 

interface AnimatedLoadingProps {
    text?: string;
}

export const Loading: React.FC<AnimatedLoadingProps> = ({text}) => {
  return (
    <div className="flex w-full h-[65vh] items-center justify-center flex-col" > 
      <BarLoader />
      <div 
        className="flex items-center justify-center mt-2 font-bold text-lg">{text}</div>
    </div>
  );
};

const variants = {
  initial: {
    scaleY: 0.5,
    opacity: 0,
  },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: "mirror",
      duration: 1,
      ease: "circIn",
    },
  },
};

const BarLoader = () => {
  return (
    <motion.div
      transition={{
        staggerChildren: 0.25,
      }}
      initial="initial"
      animate="animate"
      className="flex gap-1"
    >
      <motion.div variants={variants as any} className="h-12 w-2 bg-primary" />
      <motion.div variants={variants as any} className="h-12 w-2 bg-primary" />
      <motion.div variants={variants as any} className="h-12 w-2 bg-primary" />
      <motion.div variants={variants as any} className="h-12 w-2 bg-primary" />
      <motion.div variants={variants as any} className="h-12 w-2 bg-primary" />
    </motion.div>
  );
};
 