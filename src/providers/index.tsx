import NextTopLoader from "nextjs-toploader";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader easing="ease" showSpinner={false} color="var(--primary)" />
      {children}
    </>
  );
}
