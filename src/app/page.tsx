import { AuthShowcase } from "./_components/auth-showcase";

export default function HomePage() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Luna <span className="text-primary">Manager</span>
        </h1>
        <AuthShowcase />
      </div>
    </main>
  );
}
