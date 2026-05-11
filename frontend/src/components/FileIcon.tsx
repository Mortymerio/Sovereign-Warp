import { 
  FileCode, 
  FileJson, 
  FileText, 
  FileImage, 
  FileCode2, 
  Hash, 
  Layout, 
  Terminal,
  Cpu,
  FileBox,
  FilePieChart
} from 'lucide-react';

interface Props {
  name: string;
  size?: number;
}

export default function FileIcon({ name, size = 16 }: Props) {
  const ext = name.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={size} className="text-blue-400" />;
    case 'js':
    case 'jsx':
      return <FileCode2 size={size} className="text-yellow-400" />;
    case 'go':
      return <Terminal size={size} className="text-cyan-400" />;
    case 'py':
      return <Cpu size={size} className="text-green-500" />;
    case 'md':
      return <FileText size={size} className="text-purple-400" />;
    case 'json':
      return <FileJson size={size} className="text-amber-400" />;
    case 'css':
      return <Hash size={size} className="text-pink-400" />;
    case 'html':
      return <Layout size={size} className="text-orange-500" />;
    case 'rs':
      return <FileBox size={size} className="text-red-500" />;
    case 'csv':
      return <FilePieChart size={size} className="text-emerald-400" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
      return <FileImage size={size} className="text-indigo-400" />;
    default:
      return <FileText size={size} className="text-gray-400" />;
  }
}
