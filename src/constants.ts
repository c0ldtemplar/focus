import { 
  Utensils, 
  Music, 
  BookText, 
  Palette, 
  Recycle, 
  Cpu, 
  Gamepad2, 
  Bike,
  Mic2,
  Theater,
  Shirt 
} from "lucide-react";
import { Interest } from "./types";

export const INITIAL_INTERESTS: Interest[] = [
  { id: '1', name: 'Gastronomía Coreana', icon: 'Utensils', active: true },
  { id: '2', name: 'Música Alternativa', icon: 'Music', active: true },
  { id: '3', name: 'Manga & Animé', icon: 'BookText', active: false },
  { id: '4', name: 'Arte Callejero', icon: 'Palette', active: false },
  { id: '5', name: 'Reciclaje & Innovación', icon: 'Recycle', active: false },
  { id: '6', name: 'Tecnología', icon: 'Cpu', active: false },
  { id: '7', name: 'Gaming', icon: 'Gamepad2', active: false },
  { id: '8', name: 'Moda Independiente', icon: 'Shirt', active: false },
  { id: '9', name: 'Ciclovías & Movilidad', icon: 'Bike', active: false },
  { id: '10', name: 'Conciertos Live', icon: 'Mic2', active: false },
  { id: '11', name: 'Actividades Culturales', icon: 'Theater', active: false },
];

export const getLucideIcon = (name: string) => {
  switch (name) {
    case 'Utensils': return Utensils;
    case 'Music': return Music;
    case 'BookText': return BookText;
    case 'Palette': return Palette;
    case 'Recycle': return Recycle;
    case 'Cpu': return Cpu;
    case 'Gamepad2': return Gamepad2;
    case 'Shirt': return Shirt;
    case 'Bike': return Bike;
    case 'Mic2': return Mic2;
    case 'Theater': return Theater;
    default: return Palette;
  }
};
