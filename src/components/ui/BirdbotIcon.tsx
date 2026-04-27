export function BirdbotIcon({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      width="753"
      height="701"
      viewBox="-45 -5 843 710"
      overflow="visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="BirdBot"
    >
      <style>{`
        @keyframes bird-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        #bird-root {
          animation: bird-float 3.5s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center bottom;
          will-change: transform;
        }
        @keyframes wing-idle-left {
          0%, 100% { transform: rotate(0deg); }
          40%       { transform: rotate(8deg); }
          60%       { transform: rotate(5deg); }
        }
        @keyframes wing-idle-right {
          0%, 100% { transform: rotate(0deg); }
          40%       { transform: rotate(-8deg); }
          60%       { transform: rotate(-5deg); }
        }
        #wing-left {
          transform-box: fill-box;
          transform-origin: 90% 20%;
          animation: wing-idle-left 2.5s ease-in-out infinite;
          will-change: transform;
        }
        #wing-right {
          transform-box: fill-box;
          transform-origin: 10% 20%;
          animation: wing-idle-right 2.5s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes blink {
          0%, 3%, 100% { transform: scaleY(0); }
          1.5%          { transform: scaleY(1); }
        }
        #eyelid-left {
          transform-box: fill-box;
          transform-origin: center top;
          transform: scaleY(0);
          animation: blink 5s ease-in-out infinite;
          will-change: transform;
        }
        #eyelid-right {
          transform-box: fill-box;
          transform-origin: center top;
          transform: scaleY(0);
          animation: blink 5s ease-in-out infinite;
          animation-delay: 0.06s;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          #bird-root, #wing-left, #wing-right, #eyelid-left, #eyelid-right {
            animation: none;
          }
          #eyelid-left, #eyelid-right { transform: scaleY(0); }
        }
      `}</style>

      <g id="BirdBot-Icon-mark1">
        <g id="bird-root">
          <g id="feet">
            <path id="foot-right-toe" d="M411.938 571.035L432.216 633.075" stroke="#E07820" strokeWidth="8" strokeLinecap="round"/>
            <path id="foot-left-toe" d="M334.938 575.035L314.188 633.075" stroke="#E07820" strokeWidth="8" strokeLinecap="round"/>
            <path id="foot-left-base" d="M314.183 633.075C287.358 633.075 255.168 643.315 244.438 658.675C265.898 653.555 292.723 648.435 314.183 633.075Z" fill="#E07820" stroke="#E07820" strokeWidth="4" strokeLinecap="round"/>
            <path id="foot-left-toe1" d="M314.184 633.075C303.454 658.675 292.724 684.275 287.359 699.635C298.089 684.275 308.819 663.795 314.184 633.075Z" fill="#E07820" stroke="#E07820" strokeWidth="4" strokeLinecap="round"/>
            <path id="foot-left-toe2" d="M314.188 633.075C330.283 658.675 335.648 684.275 341.013 699.635C330.283 674.035 319.553 653.555 314.188 633.075Z" fill="#E07820" stroke="#E07820" strokeWidth="4" strokeLinecap="round"/>
            <path id="foot-right-base" d="M432.219 633.075C459.044 633.075 491.234 643.315 501.964 658.675C480.504 653.555 453.679 648.435 432.219 633.075Z" fill="#E07820" stroke="#E07820" strokeWidth="4" strokeLinecap="round"/>
            <path id="foot-right-toe1" d="M432.216 633.075C421.486 658.675 410.756 684.275 405.391 699.635C416.121 684.275 426.851 663.795 432.216 633.075Z" fill="#E07820" stroke="#E07820" strokeWidth="4" strokeLinecap="round"/>
            <path id="foot-right-toe2" d="M432.219 633.075C448.314 658.675 453.679 684.275 459.044 699.635C448.314 674.035 437.584 653.555 432.219 633.075Z" fill="#E07820" stroke="#E07820" strokeWidth="4" strokeLinecap="round"/>
          </g>
          <g id="body-group">
            <g id="body">
              <path d="M376.436 605.261C526.229 605.261 647.661 483.829 647.661 334.036C647.661 184.242 526.229 62.8105 376.436 62.8105C226.643 62.8105 105.211 184.242 105.211 334.036C105.211 483.829 226.643 605.261 376.436 605.261Z" fill="url(#paint0_linear_1023_3599)"/>
            </g>
            <path id="belly" d="M376.438 605.035C473.64 605.035 552.438 536.759 552.438 452.535C552.438 368.312 473.64 300.035 376.438 300.035C279.235 300.035 200.438 368.312 200.438 452.535C200.438 536.759 279.235 605.035 376.438 605.035Z" fill="url(#paint1_radial_1023_3599)"/>
            <path id="beak" d="M376.438 397.035L464.637 470.535L376.438 441.135V397.035Z" fill="#FFA000"/>
            <g id="crest">
              <path id="crest-back-left" d="M340.027 197.127C367.442 189.781 380.402 149.255 368.976 106.61C357.549 63.9645 326.062 35.3486 298.647 42.6944C271.232 50.0402 258.271 90.5659 269.698 133.211C281.125 175.857 312.612 204.472 340.027 197.127Z" fill="#FCD34D"/>
              <path id="crest-center" d="M376.436 182.72C407.971 182.72 433.536 141.817 433.536 91.36C433.536 40.9033 407.971 0 376.436 0C344.9 0 319.336 40.9033 319.336 91.36C319.336 141.817 344.9 182.72 376.436 182.72Z" fill="#7DD3FC"/>
              <path id="crest-back-right" d="M412.845 197.126C440.26 204.472 471.747 175.856 483.174 133.211C494.601 90.5658 481.64 50.04 454.225 42.6943C426.81 35.3485 395.323 63.9644 383.896 106.61C372.469 149.255 385.43 189.781 412.845 197.126Z" fill="#FBBF24"/>
              <path id="crest-front-left" d="M356.626 167.834C378.486 164.762 392.294 134.424 387.466 100.072C382.638 65.7208 361.004 40.3641 339.144 43.4363C317.284 46.5085 303.476 76.8463 308.304 111.198C313.132 145.549 334.766 170.906 356.626 167.834Z" fill="#93C5FD"/>
              <path id="crest-front-right" d="M396.247 167.834C418.107 170.906 439.741 145.55 444.569 111.198C449.397 76.8468 435.589 46.509 413.729 43.4368C391.869 40.3646 370.235 65.7213 365.407 100.073C360.579 134.424 374.387 164.762 396.247 167.834Z" fill="#FDE047"/>
            </g>
          </g>
          <g id="wing-left">
            <g id="wing-left-inner-wrap">
              <g id="wing-left-inner">
                <g id="wing-left-feather1">
                  <path d="M179.619 367.97C158.224 375.755 126.633 342.833 109.057 294.434C91.482 246.036 94.5781 200.49 115.973 192.705C137.367 184.919 168.959 217.842 186.534 266.24C204.109 314.638 201.013 360.184 179.619 367.97Z" fill="url(#paint2_linear_1023_3599)"/>
                </g>
                <g id="wing-left-feather2">
                  <path d="M187.324 364.08C172.387 381.879 126.981 368.329 85.9082 333.815C44.8352 299.302 23.6483 256.894 38.5859 239.095C53.5235 221.296 98.929 234.846 140.002 269.359C181.075 303.873 202.262 346.281 187.324 364.08Z" fill="url(#paint3_linear_1023_3599)"/>
                </g>
              </g>
            </g>
            <path id="wing-left-feather3" d="M11.945 282.372C6.62797 296.977 42.9141 323.591 92.9924 341.815C143.071 360.039 187.978 362.971 193.295 348.366C198.612 333.76 162.325 307.146 112.247 288.922C62.1688 270.699 17.262 267.766 11.945 282.372Z" fill="url(#paint4_linear_1023_3599)"/>
            <g id="wing-left-feather4">
              <path d="M195.733 347.398C195.733 370.17 153.985 388.597 102.487 388.557C50.9895 388.517 9.24219 370.023 9.24219 347.251C9.24219 324.479 50.9895 306.051 102.487 306.092C153.985 306.132 195.733 324.625 195.733 347.398Z" fill="url(#paint5_linear_1023_3599)"/>
            </g>
          </g>
          <g id="wing-right">
            <g id="wing-right-inner-wrap">
              <g id="wing-right-inner">
                <g id="wing-right-feather1">
                  <path d="M573.248 374.975C594.643 382.761 626.235 349.837 643.811 301.438C661.386 253.039 658.29 207.492 636.895 199.706C615.5 191.92 583.908 224.844 566.333 273.243C548.757 321.642 551.853 367.189 573.248 374.975Z" fill="url(#paint6_linear_1023_3599)"/>
                </g>
                <g id="wing-right-feather2">
                  <path d="M565.549 371.084C580.487 388.883 625.893 375.333 666.967 340.819C708.04 306.305 729.227 263.896 714.29 246.097C699.352 228.297 653.945 241.848 612.872 276.362C571.798 310.876 550.611 353.285 565.549 371.084Z" fill="url(#paint7_linear_1023_3599)"/>
                </g>
              </g>
            </g>
            <path id="wing-right-feather3" d="M740.933 289.374C746.25 303.98 709.963 330.594 659.884 348.818C609.805 367.042 564.898 369.975 559.581 355.369C554.264 340.763 590.55 314.149 640.629 295.925C690.708 277.7 735.616 274.767 740.933 289.374Z" fill="url(#paint8_linear_1023_3599)"/>
            <g id="wing-right-feather4">
              <path d="M557.147 354.402C557.147 377.175 598.895 395.603 650.394 395.562C701.893 395.522 743.641 377.028 743.641 354.256C743.641 331.483 701.893 313.055 650.394 313.096C598.895 313.136 557.147 331.63 557.147 354.402Z" fill="url(#paint9_linear_1023_3599)"/>
            </g>
          </g>
          <g id="eye-left">
            <path id="sclera-left" d="M305.059 388.28C342.902 388.28 373.579 357.603 373.579 319.76C373.579 281.918 342.902 251.24 305.059 251.24C267.217 251.24 236.539 281.918 236.539 319.76C236.539 357.603 267.217 388.28 305.059 388.28Z" fill="white"/>
            <path id="eye-outline-left" opacity="0.3" d="M305.059 388.28C342.902 388.28 373.579 357.603 373.579 319.76C373.579 281.918 342.902 251.24 305.059 251.24C267.217 251.24 236.539 281.918 236.539 319.76C236.539 357.603 267.217 388.28 305.059 388.28Z" stroke="#3B82F6"/>
            <path id="pupil-left" d="M303.478 367.115C329.457 367.115 350.518 346.055 350.518 320.075C350.518 294.096 329.457 273.035 303.478 273.035C277.498 273.035 256.438 294.096 256.438 320.075C256.438 346.055 277.498 367.115 303.478 367.115Z" fill="#1F2937"/>
            <path id="highlight-left" d="M318.182 320.076C329.548 320.076 338.762 310.862 338.762 299.496C338.762 288.13 329.548 278.916 318.182 278.916C306.816 278.916 297.602 288.13 297.602 299.496C297.602 310.862 306.816 320.076 318.182 320.076Z" fill="#67E8F9"/>
            <circle id="eyelid-left" cx="305.059" cy="319.76" r="68.52" fill="#61A9FD"/>
          </g>
          <g id="eye-right">
            <path id="sclera-right" d="M447.809 388.28C485.652 388.28 516.329 357.603 516.329 319.76C516.329 281.918 485.652 251.24 447.809 251.24C409.967 251.24 379.289 281.918 379.289 319.76C379.289 357.603 409.967 388.28 447.809 388.28Z" fill="white"/>
            <path id="eye-outline-right" opacity="0.3" d="M447.809 388.28C485.652 388.28 516.329 357.603 516.329 319.76C516.329 281.918 485.652 251.24 447.809 251.24C409.967 251.24 379.289 281.918 379.289 319.76C379.289 357.603 409.967 388.28 447.809 388.28Z" stroke="#3B82F6"/>
            <path id="pupil-right" d="M447.478 367.115C473.457 367.115 494.518 346.055 494.518 320.075C494.518 294.096 473.457 273.035 447.478 273.035C421.498 273.035 400.438 294.096 400.438 320.075C400.438 346.055 421.498 367.115 447.478 367.115Z" fill="#1F2937"/>
            <path id="highlight-right" d="M462.182 320.076C473.548 320.076 482.762 310.862 482.762 299.496C482.762 288.13 473.548 278.916 462.182 278.916C450.816 278.916 441.602 288.13 441.602 299.496C441.602 310.862 450.816 320.076 462.182 320.076Z" fill="#67E8F9"/>
            <circle id="eyelid-right" cx="447.809" cy="319.76" r="68.52" fill="#61A9FD"/>
          </g>
        </g>
      </g>

      <defs>
        <linearGradient id="paint0_linear_1023_3599" x1="105.211" y1="62.8105" x2="105.437" y2="605.035" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7DD3FC"/>
          <stop offset="1" stopColor="#3874FF"/>
        </linearGradient>
        <radialGradient id="paint1_radial_1023_3599" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(376.438 452.535) scale(176 152.5)">
          <stop stopColor="#1E40AF" stopOpacity="0.3"/>
          <stop offset="1" stopColor="#1E40AF" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="paint2_linear_1023_3599" x1="115.973" y1="192.705" x2="179.738" y2="367.926" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ECBFF"/>
          <stop offset="1" stopColor="#0F57FF"/>
        </linearGradient>
        <linearGradient id="paint3_linear_1023_3599" x1="43.284" y1="237.355" x2="198.455" y2="353.347" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ECBFF"/>
          <stop offset="1" stopColor="#3471FF"/>
        </linearGradient>
        <linearGradient id="paint4_linear_1023_3599" x1="12.1713" y1="289.57" x2="186.765" y2="343.685" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FCD34D"/>
          <stop offset="1" stopColor="#967E2E"/>
        </linearGradient>
        <linearGradient id="paint5_linear_1023_3599" x1="5.77802" y1="342.821" x2="198.16" y2="351.523" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ECBFF"/>
          <stop offset="1" stopColor="#3874FF"/>
        </linearGradient>
        <linearGradient id="paint6_linear_1023_3599" x1="636.895" y1="199.706" x2="573.129" y2="374.931" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ECBFF"/>
          <stop offset="1" stopColor="#0F57FF"/>
        </linearGradient>
        <linearGradient id="paint7_linear_1023_3599" x1="709.591" y1="244.357" x2="554.417" y2="360.35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ECBFF"/>
          <stop offset="1" stopColor="#3471FF"/>
        </linearGradient>
        <linearGradient id="paint8_linear_1023_3599" x1="740.707" y1="296.572" x2="566.11" y2="350.687" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FCD34D"/>
          <stop offset="1" stopColor="#967E2E"/>
        </linearGradient>
        <linearGradient id="paint9_linear_1023_3599" x1="747.105" y1="349.826" x2="554.719" y2="358.528" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5ECBFF"/>
          <stop offset="1" stopColor="#3874FF"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
