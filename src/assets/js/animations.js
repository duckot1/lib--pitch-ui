import { gsap, TweenMax, Linear, Back, Power4 } from 'gsap';
import { CSSPlugin } from 'gsap/CSSPlugin'

// Force CSSPlugin to not get dropped during build
gsap.registerPlugin(CSSPlugin)

const duration = 0.3;

export default {
    showPassDetails(target, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateX(-100%)',
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    hidePassDetails(target, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateX(0)',
                onComplete() {
                    if (cb) cb()
                }
            });
    },

    hideModalOverlay(target, cb) {
        return TweenMax
            .to(target, duration, {
                opacity: 0,
                onComplete() {
                    if (cb) cb();
                }
            });
    },

    showModalOverlay(target, cb) {
        return TweenMax
            .from(target, duration, {
                opacity: 0,
                onComplete() {
                    if (cb) cb();
                }
            });
    },

    slideBarIn(target, cb) {
        return TweenMax
            .from(target, duration, {
                transform: 'translateX(100%)',
                onComplete() {
                    if (cb) cb();
                }
            });
    },

    slideBarOut(target, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateX(100%)',
                onComplete() {
                    if (cb) cb();
                }
            });
    },

    expandDropdownDown(target, sectionHeight, cb) {
        return TweenMax
            .to(target, 0.2, {
                height: `${sectionHeight}px`,
                opacity: 1,
                onComplete() {
                    if (cb) cb()
                }
            })
    },

    expandDropdownUp(target, sectionHeight, cb) {
        return TweenMax
            .to(target, 0.2, {
                height: `${sectionHeight}px`,
                opacity: 1,
                onComplete() {
                    if (cb) cb()
                }
            })
    },

    collapseDropdown(target, cb) {
        return TweenMax
            .to(target, {
                duration: 0.2,
                height: '0px',
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            })
    },

    // Timeline

    drawTimeline(target, duration, height, cb) {
        return TweenMax
            .to(target, duration, {
                height: `${height}px`,
                ease: Linear.easeNone,
                onComplete() {
                    if (cb) cb()
                }
            })
    },
    hideTimeline(target, duration, height, cb) {
        return TweenMax
            .to(target, duration, {
                height,
                onComplete() {
                    if (cb) cb()
                }
            })
    },

    showEvent(target, delay, cb) {
        return TweenMax
            .to(target, 1, {
                delay,
                opacity: 1,
                onComplete() {
                    if (cb) cb()
                }
            })
    },

    showDiv(target, duration, cb) {
        return TweenMax
            .to(target, duration, {
                opacity: 1,
                onComplete() {
                    if (cb) cb()
                }
            })
    },
    hideDiv(target, duration, cb) {
        return TweenMax
            .to(target, duration, {
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            })
    },
    toggleDetails(target, translateX, cb) {
        return TweenMax
            .to(target, 0.1, {
                transform: `translateX(${translateX})`,
                ease: Linear.easeNone,
                onComplete() {
                    if (cb) cb()
                }
            })
    },

    // Speedometer

    moveNeedle(target, deg, cb) {
        return TweenMax
            .to(target, 2, {
                transform: `rotate(${deg}deg)`,
                ease: Back.easeOut.config(1.7),
                onComplete() {
                    if (cb) cb();
                }
            })
    },

    // Authentication

    show(target, cb) {
        return TweenMax
            .from(target, duration, {
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    showTo(target, cb) {
        return TweenMax
            .to(target, duration, {
                opacity: 1,
                onComplete() {
                    if (cb) cb();
                }
            })
    },
    hide(target, cb) {
        return TweenMax
            .to(target, duration, {
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    hideFrom(target, cb) {
        return TweenMax
            .from(target, duration, {
                opacity: 1,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    moveLeft(target, cb) {
        return TweenMax
            .to(target, 1, {
                ease: Power4.easeInOut,
                transform: 'translateX(-50%)',
                onComplete() {
                    if (cb) cb()
                }
            })
    },
    moveRight(target, cb) {
        return TweenMax
            .from(target, 1, {
                ease: Power4.easeInOut,
                transform: 'translateX(-50%)',
                onComplete() {
                    if (cb) cb()
                }
            })
    },
    shrinkRight(target, cb) {
        return TweenMax
            .to(target, 1, {
                ease: Power4.easeInOut,
                transform: 'scaleX(0.5) translateX(-50%)',
                onComplete() {
                    if (cb) cb()
                }
            })
    },
    shrinkLeft(target, cb) {
        return TweenMax
            .to(target, 1, {
                ease: Power4.easeInOut,
                transform: 'scaleX(0.5) translateX(-50%)',
                onComplete() {
                    if (cb) cb()
                }
            })
    },
    slideOutRight(target, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateX(140%) scale(1)',
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    slideOutLeft(target, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateX(-100%) scale(1)',
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    slideOutBottom(target, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateY(140%) scale(1)',
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    slideOutTop(target, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateY(-100%) scale(1)',
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    slideInLeft(target, cb) {
        return TweenMax
            .from(target, duration, {
                transform: 'translateX(-100%) scale(1)',
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    slideInRight(target, cb) {
        return TweenMax
            .from(target, duration, {
                transform: 'translateX(140%) scale(1)',
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    slideInBottom(target, cb) {
        return TweenMax
            .from(target, duration, {
                transform: 'translateY(140%) scale(1)',
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    slideInTop(target, cb) {
        return TweenMax
            .from(target, duration, {
                transform: 'translateY(-100%) scale(1)',
                opacity: 0,
                onComplete() {
                    if (cb) cb()
                }
            });
    },

    // Animation Modal

    slideModalIn(target, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateY(-100%) scale(1)',
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    slideModalOut(target, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateY(0) scale(1)',
                onComplete() {
                    if (cb) cb()
                }
            });
    },

    // Aactivity screen

    dropDown(target, translateY, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateY(100%)',
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    clearDropDown(target, translateY, cb) {
        return TweenMax
            .to(target, duration, {
                transform: 'translateY(0)',
                onComplete() {
                    if (cb) cb()
                }
            });
    },
    dropDownDiv(target){
        return TweenMax
            .to(target, duration, {
                height: `15%`,
            })
    },
    pullUpDiv(target){
        return TweenMax
            .to(target, duration, {
                height: `0%`,
            })
    },
    slideEdit(target){
        return TweenMax
            .to(target, duration, {
                height: '80px',
                width: '140px',
                opacity: '1',
                display: 'flex',
            })
    },
    slideAwayEdit(target, cb){
        return TweenMax
            .to(target, duration, {
                height: '0px',
                width: '0px',
                opacity: '0',
                display: 'none',
                onComplete() {
                  if (cb) cb()
                }
            })
    },

    // Search component

    showSearch(target){
        return TweenMax
            .to(target, duration, {
                width: '200px',
                display: 'flex'
            })
    },
    hideSearch(target){
        return TweenMax
            .to(target, duration, {
                width: '0px',
                display: 'none'
            })
    },
    moveSearch(target){
        return TweenMax
            .to(target, duration, {
                transform: `translateX(-200px) scale(1)`,
            })
    },
    moveSearchBack(target) {
        return TweenMax
            .to(target, duration, {
                transform: `translateX(0) scale(1)`,
            })
    },

    // Flight cards
    arrowGrow(target, cb) {
      return TweenMax
          .to(target, 0.3, {
              height: `100%`,
              onComplete() {
                if (cb) cb()
              }
          })
    },

    slideCardIn(target) {
      return TweenMax
          .to(target, 0.3, {
              left: '0px'
          })
    },

    // Session page animations

    slideDownTopBar(target, cb) {
      return TweenMax
          .to(target, 0.3, {
            transform: 'translateY(0)',
            onComplete() {
              if (cb) cb()
            }
          })
    },

    slideUpTopBar(target, cb) {
      return TweenMax
          .to(target, 0.3, {
            transform: 'translateY(-110%)',
            onComplete() {
              if (cb) cb()
            }
          })
    }
}
