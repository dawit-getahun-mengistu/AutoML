import {
  House,
} from "lucide-react";
import Link from "next/link";
import {Button} from "../NewButton";
import { Project } from "@/libb/features/project/projectSlice";
type SideBarProps = {
  projects: Project[];
};
export default function SideBar(projects:SideBarProps){
    return(
         <aside className="w-64 bg-white shadow-lg p-4 flex flex-col justify-between">
          <nav className="space-y-4">
            <Button variant="outline" className="w-full flex items-center">
              <House className="mr-2" /> Home
            </Button>
           <span className="block pl-4 text-black font-bold ">
           Projects 
           </span> 
           {projects.projects.length=== 0? (<span> No projects available</span>):(
            
            projects.projects.map((project)=>(
                <Link key= {project.id} className="block pl-4 text-black " href={`/dashboard/projects/${project.id}`}>
                {project.name}
                </Link>
            ))
           )}
          </nav>
        </aside>
    );
}