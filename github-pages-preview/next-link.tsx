import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

export default function StaticLink({ href, children, ...props }: Props) {
  const target = href.endsWith("/ugc") ? "#ugc" : href.endsWith("/advertiser") ? "#advertiser" : "#overview";
  return <a href={target} {...props}>{children}</a>;
}
