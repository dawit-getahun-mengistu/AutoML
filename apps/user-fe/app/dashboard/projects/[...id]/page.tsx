"use client";
import { useParams } from "next/navigation";
//TODO: call get project by id 
//TODO: pass in the id as a prop
export default function Page() {
  const params = useParams();
  // const {id} = params;
  return <p>Post: {params.id}</p>
}