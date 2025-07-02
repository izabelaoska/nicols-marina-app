import useImage from 'use-image'
export default function useBoatIcon() {
  const [img] = useImage('/boat_icon.png')
  return img
}
