
import Dashboard from "@/components/dashboard";
import { getInitialPortfolioData } from "@/app/actions";
import { AppWrapper } from "@/components/app-wrapper";

export default async function Home() {
  const initialPortfolioData = await getInitialPortfolioData();
  
  return (
    <AppWrapper>
      <main className="flex flex-col min-h-screen w-full">
        <Dashboard initialData={initialPortfolioData} />
      </main>
    </AppWrapper>
  );
}
