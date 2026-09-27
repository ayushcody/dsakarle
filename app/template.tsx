export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade flex min-h-screen flex-col">{children}</div>;
}
