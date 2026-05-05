export function WebFrame({ url, name }: { url: string; name: string }) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-3 py-1.5 text-[11px] os-text-muted border-b border-white/10 flex items-center justify-between">
        <span className="truncate">{url}</span>
        <a href={url} target="_blank" rel="noreferrer" className="ml-2 underline opacity-70 hover:opacity-100">open</a>
      </div>
      <iframe src={url} title={name} className="flex-1 w-full bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation" />
    </div>
  );
}