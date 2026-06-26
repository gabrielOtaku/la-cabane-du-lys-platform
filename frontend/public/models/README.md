Modèles 3D (.glb / .gltf) pour la Salle des Trophées.
Déposez ici vos reliques exportées (Blender → glTF). Chargez-les avec useGLTF de @react-three/drei :

  import { useGLTF } from '@react-three/drei';
  const { scene } = useGLTF('/models/moteur.glb');

Le cahier des charges recommande la mise en cache de ces fichiers lourds via le CDN Cloudflare.
