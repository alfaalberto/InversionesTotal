import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, Bot, User, Settings, LogOut, Target } from "lucide-react";
import Dashboard from "@/components/dashboard";

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
           <div className="flex items-center gap-2 p-2 justify-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
             <Button variant="ghost" size="icon" className="group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"><Target className="text-primary h-6 w-6" /></Button>
             <h1 className="font-headline text-xl font-bold text-primary group-data-[collapsible=icon]:hidden">Profolio Lens</h1>
           </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" isActive tooltip="Panel de control">
                <LayoutDashboard />
                <span>Panel de control</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" tooltip="Análisis con IA">
                <Bot />
                <span>Análisis con IA</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:aspect-square">
                 <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="Usuario" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="text-left group-data-[collapsible=icon]:hidden">
                  <p className="font-medium text-sm">Usuario</p>
                  <p className="text-xs text-muted-foreground">user@email.com</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="mr-2 h-4 w-4" />Perfil</DropdownMenuItem>
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem><LogOut className="mr-2 h-4 w-4" />Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background/95">
        <header className="flex h-14 items-center gap-4 border-b bg-transparent px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
          <SidebarTrigger className="md:hidden"/>
          <h1 className="text-lg font-semibold md:text-2xl font-headline">Panel de control</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
           <Dashboard />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
