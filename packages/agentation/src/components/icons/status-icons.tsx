"use client";

export const IconCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M3 8l3.5 3.5L13 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Checkbox checkmark (smaller, optimized for checkboxes)

export const IconCheckSmall = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path
      d="M3.9375 7L6.125 9.1875L10.5 4.8125"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// List with sparkle icon

export const IconHelp = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle
      cx="10"
      cy="10.5"
      r="5.25"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <path
      d="M8.5 8.75C8.5 7.92 9.17 7.25 10 7.25C10.83 7.25 11.5 7.92 11.5 8.75C11.5 9.58 10.83 10.25 10 10.25V11"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="13" r="0.75" fill="currentColor" />
  </svg>
);

// Animated checkmark with draw + bounce effect

export const IconCheckmark = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g clipPath="url(#clip0_2_45)">
      <path
        d="M16.25 8.75L10 15.25L7.25 12.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_2_45">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// Large checkmark icon

export const IconCheckmarkLarge = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g clipPath="url(#clip0_2_37)">
      <path
        d="M17.5962 7.75L9.42308 16.25L6.15385 12.6538"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_2_37">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// Checkmark in circle icon

export const IconCheckmarkCircle = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g clipPath="url(#clip0_checkmark_circle)">
      <path
        d="M12 20C7.58172 20 4 16.4182 4 12C4 7.58172 7.58172 4 12 4C16.4182 4 20 7.58172 20 12C20 16.4182 16.4182 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 10L11 14.25L9.25 12.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_checkmark_circle">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// X mark / close icon

export const IconXmark = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <g clipPath="url(#clip0_2_53)">
      <path
        d="M16.25 16.25L7.75 7.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.75 16.25L16.25 7.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_2_53">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// X mark large / close icon (larger variant)

export const IconXmarkLarge = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M16.7198 6.21973C17.0127 5.92683 17.4874 5.92683 17.7803 6.21973C18.0732 6.51262 18.0732 6.9874 17.7803 7.28027L13.0606 12L17.7803 16.7197C18.0732 17.0126 18.0732 17.4874 17.7803 17.7803C17.4875 18.0731 17.0127 18.0731 16.7198 17.7803L12.0001 13.0605L7.28033 17.7803C6.98746 18.0731 6.51268 18.0731 6.21979 17.7803C5.92689 17.4874 5.92689 17.0126 6.21979 16.7197L10.9395 12L6.21979 7.28027C5.92689 6.98738 5.92689 6.51262 6.21979 6.21973C6.51268 5.92683 6.98744 5.92683 7.28033 6.21973L12.0001 10.9395L16.7198 6.21973Z"
      fill="currentColor"
    />
  </svg>
);

// Sun icon (light mode)
