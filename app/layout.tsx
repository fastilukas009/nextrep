import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'FastRep — Sun peli. Sun kehitys.',description:'Koripalloilijan treenit, ruokapäiväkirja ja heittohaasteet. Yksi toisto kerrallaan.',icons:{icon:'/favicon.svg'},manifest:'/manifest.webmanifest'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fi"><body>{children}</body></html>}
