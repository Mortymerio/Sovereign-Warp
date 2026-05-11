import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FolderPlus, Trash2, Edit2, Copy, X } from 'lucide-react';

import { useStore } from '../store';
import { FilesystemService, EditorService, IntelService, WatchService, KnowledgeService } from '../../bindings/sovereign-warp/services';
import { Events } from '@wailsio/runtime';
import ContextMenu from './ContextMenu';
import FileIcon from './FileIcon';

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

export default function FileExplorer() {
  const rootPaths = useStore(s => s.rootPaths);
  const addRootPath = useStore(s => s.addRootPath);
  const removeRootPath = useStore(s => s.removeRootPath);
  const fileTrees = useStore(s => s.fileTrees);
  const updateFileTree = useStore(s => s.updateFileTree);
  const openFile = useStore(s => s.openFile);
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, path: string, isDir: boolean } | null>(null);

  useEffect(() => {
    refreshAllTrees();
    const unsub = Events.On('fs-change', () => {
      refreshAllTrees();
    });
    return () => unsub();
  }, [rootPaths]);

  const refreshAllTrees = async () => {
    for (const root of rootPaths) {
      const tree = await FilesystemService.OpenFolder(root);
      if (tree) updateFileTree(root, tree);
    }
  };

  const handleAddFolder = async () => {
    const path = await FilesystemService.PickFolder();
    if (path) {
      addRootPath(path);
      const tree = await FilesystemService.OpenFolder(path);
      if (tree) updateFileTree(path, tree);
      IntelService.IndexWorkspace(path);
      WatchService.StartWatching(path);
      KnowledgeService.Initialize(path);
    }
  };


  const toggleExpand = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleFileClick = async (path: string, isPreview: boolean = true) => {
    const meta = await EditorService.OpenFile(path);
    if (meta) {
      const name = path.split(/[/\\]/).pop() || '';
      openFile(path, name, meta.language, meta.totalLines, meta.size, isPreview);
    }
  };

  const renderTree = (nodes: FileNode[]) => {
    return nodes.map(node => (
      <div key={node.path} className="select-none">
        <div
          className="group flex items-center py-1 px-2 hover:bg-white/5 cursor-pointer text-[13px] text-white/70 hover:text-white transition-colors"
          onClick={() => node.isDir ? toggleExpand(node.path) : handleFileClick(node.path, true)}
          onDoubleClick={() => !node.isDir && handleFileClick(node.path, false)}
          onContextMenu={(e) => handleContextMenu(e, node.path, node.isDir)}
        >

          <span className="w-4 h-4 flex items-center justify-center mr-1">
            {node.isDir ? (
              expanded[node.path] ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : null}
          </span>
          <span className="mr-2">
            {node.isDir ? (
              expanded[node.path] ? <FolderOpen size={16} className="text-blue-400" /> : <Folder size={16} className="text-blue-400" />
            ) : <FileIcon name={node.name} />}
          </span>

          <span className="truncate">{node.name}</span>
        </div>
        {node.isDir && expanded[node.path] && node.children && (
          <div className="ml-4 border-l border-white/5">
            {renderTree(node.children)}
          </div>
        )}
      </div>
    ));
  };

  const handleContextMenu = (e: React.MouseEvent, path: string, isDir: boolean) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path, isDir });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#1a1d21]">
      <div className="h-10 flex items-center px-4 border-b border-white/5 shrink-0 bg-[#1e2329]">
        <span className="text-[11px] font-bold uppercase tracking-widest opacity-40">Explorer</span>
        <div className="ml-auto flex gap-1">
          <button onClick={handleAddFolder} title="Add Folder to Workspace" className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {rootPaths.length === 0 ? (
          <div className="p-6">
            <button
              onClick={handleAddFolder}
              className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded border border-cyan-500/20 transition-all tracking-widest uppercase neon-glow"
            >
              OPEN PROJECT
            </button>
          </div>
        ) : (
          rootPaths.map(root => (
            <div key={root} className="mb-2">
              <div 
                className="flex items-center px-2 py-1 bg-white/5 border-y border-white/5 cursor-default group"
                onClick={() => toggleExpand(root)}
              >
                <span className="w-4 h-4 flex items-center justify-center mr-1 opacity-40">
                  {expanded[root] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 truncate">
                  {root.split(/[/\\]/).pop()}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeRootPath(root); }}
                  className="ml-auto opacity-0 group-hover:opacity-40 hover:opacity-100 p-1 hover:text-red-400"
                >
                  <X size={10} />
                </button>
              </div>
              {expanded[root] && fileTrees[root] && (
                <div className="mt-1">
                  {renderTree(fileTrees[root].children || [])}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { label: 'Rename', icon: <Edit2 size={14} />, onClick: () => alert('Not implemented yet') },
            { label: 'Copy Path', icon: <Copy size={14} />, onClick: () => navigator.clipboard.writeText(contextMenu.path) },
            { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => {} }, // Implementar delete
          ]}
        />
      )}
    </div>
  );
}

