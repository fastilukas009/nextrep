import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'NextRep — Train. Fuel. Compete.',description:'Oma kehitys. Seuraava taso. Koristreeni, harjoituspäiväkirja, ravinto ja haasteet.',icons:{icon:'/favicon.svg'},manifest:'/manifest.webmanifest'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fi"><body>{children}</body></html>}
