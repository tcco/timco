import { useEffect, useState } from 'react';
import { motion, useTransform, useScroll } from 'framer-motion';

interface ModelProps {
  imageDetails: {
    width: number;
    height: number;
  };
}

//Ease
const transition = { duration: 1.4, ease: [0.6, 0.01, -0.05, 0.9] };

const firstName = {
  initial: {
    y: 0,
  },
  animate: {
    y: 0,
    transition: {
      delayChildren: 0.6,
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const lastName = {
  initial: {
    y: 0,
  },
  animate: {
    y: 0,
    transition: {
      delayChildren: 0.6,
      staggerChildren: 0.04,
      staggerDirection: 1,
    },
  },
};

const letter = {
  initial: {
    y: 400,
  },
  animate: {
    y: 0,
    transition: { ...transition, duration: 1 },
  },
};

const Model = ({ imageDetails }: ModelProps) => {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 8], [1, 1.3]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, 200]);   // Moves down as you scroll

  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    if (canScroll === false) {
      document.querySelector('body')?.classList.add('no-scroll');
    } else {
      document.querySelector('body')?.classList.remove('no-scroll');
    }
  }, [canScroll]);

  return (
    <>
      {/* <Header /> */}
      <motion.div
        onAnimationComplete={() => setCanScroll(true)}
        className="single"
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="container fluid">
          <div className="row center top-row">
            <div className="top">
              <motion.div className="model" style={{ y: yText }}>
                <motion.span className="first" variants={firstName}>
                  <motion.span variants={letter}>T</motion.span>
                  <motion.span variants={letter}>I</motion.span>
                  <motion.span variants={letter}>M</motion.span>
                </motion.span>
                <motion.span className="last" variants={lastName}>
                  <motion.span variants={letter}>C</motion.span>
                  <motion.span variants={letter}>O</motion.span>
                </motion.span>
              </motion.div>
            </div>
          </div>

          <div className="row bottom-row">
            <div className="bottom">
              <div className="image-container-single">
                <motion.div
                  initial={{
                    width: 0,
                    height: 0,
                  }}
                  animate={{
                    width: 350,
                    height: 450,
                    transition: { delay: 0.6, ...transition, duration: 1 },
                  }}
                  style={{ y }}
                  className="thumbnail-single"
                >
                  <motion.div
                    className="frame-single"
                    whileHover="hover"
                    transition={transition}
                  >
                    <motion.img
                      src={'/tim.png'}
                      alt="an image"
                      style={{ scale: scale }}
                      initial={{
                        scale: 1,
                        y: 0,
                      }}
                      animate={{
                        transition: { delay: 0.2, ...transition },
                      }}
                      className="object-cover object-bottom max-lg:object-center max-md:object-center"
                    />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Model;
