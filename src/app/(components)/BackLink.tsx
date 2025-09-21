"use client";

import Link from "next/link";

type Props = {
  children: React.ReactNode;
  className?: string;
  fallbackHref?: string;
};

export default function BackLink({ children, className, fallbackHref = "/" }: Props) {
  return (
    <Link
      href={fallbackHref}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        if (typeof window !== "undefined") {
          if (window.history.length > 1) {
            window.history.back();
          } else if (document.referrer) {
            window.location.href = document.referrer;
          } else {
            window.location.href = fallbackHref;
          }
        }
      }}
    >
      {children}
    </Link>
  );
}


