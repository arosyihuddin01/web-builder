import Header from '../../components/layout/Header';
import Shell from '../../components/layout/Shell';
import Sidebar from '../../components/layout/Sidebar';

export default function EditorPage() {
  return (
    <Shell header={<Header />} sidebar={<Sidebar />}>
      <div className="grid h-full grid-rows-[auto_1fr] gap-4">
        <div className="card p-4">
          <h1 className="text-xl font-semibold">Editor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This is a placeholder for the editor canvas and tools.
          </p>
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-medium">Preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live preview of the current design will appear here.
          </p>
        </div>
      </div>
    </Shell>
  );
}
