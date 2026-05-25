export interface MediaItem {
  type: 'image' | 'video';
  src: string;
  description?: string;
}

export interface Material {
  name: string;
  description: string;
  icon?: string;
}

export interface Service {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  isSpecial?: boolean;
  interior?: MediaItem[];
  exterior?: MediaItem[];
  images?: MediaItem[];
  materials?: Material[];
}
