import svgPaths from "./svg-4p7w0j39fj";
import imgImage from "figma:asset/54ca3dc26982ea8bf0465b1f9de6b083e97871e9.png";

function Image() {
  return (
    <div className="h-[150px] relative shrink-0 w-full" data-name="Image">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage} />
    </div>
  );
}

function LeftCol() {
  return (
    <div className="content-stretch flex flex-col gap-px items-start leading-[normal] relative shrink-0 w-[88px]" data-name="left col">
      <p className="font-['Inter:Extra_Bold_Italic',_sans-serif] font-extrabold italic relative shrink-0 text-[#151e24] text-[40px] w-full">58</p>
      <p className="font-['Inter:Regular',_sans-serif] font-normal not-italic relative shrink-0 text-[#151e24] text-[14px] w-full">Plant monitor</p>
      <p className="font-['Inter:Regular',_sans-serif] font-normal not-italic relative shrink-0 text-[#678800] text-[12px] w-full">24 minutes ago</p>
    </div>
  );
}

function RightCol() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name="right col">
      <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#678800] text-[12px] text-nowrap whitespace-pre">1/4</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
      <LeftCol />
      <RightCol />
    </div>
  );
}

function Settings() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="settings">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g clipPath="url(#clip0_1_28)" id="settings">
          <path d={svgPaths.p3cccb600} id="Vector" stroke="var(--stroke-0, #152A38)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p3737f500} id="Vector_2" stroke="var(--stroke-0, #152A38)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
        <defs>
          <clipPath id="clip0_1_28">
            <rect fill="white" height="24" width="24" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-end p-[12px] relative w-full">
          <Frame6 />
          <Settings />
        </div>
      </div>
    </div>
  );
}

export default function Card() {
  return (
    <div className="bg-[#f9ffff] relative rounded-[24px] size-full" data-name="Card">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <Image />
        <Frame7 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.04)] border-solid inset-0 pointer-events-none rounded-[24px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.12)]" />
    </div>
  );
}