import {
  Home,
  Map,
  Settings,
  Search,
  Utensils,
  ShoppingBasket,
  Shirt,
  HeartPulse,
  House,
  Wrench,
  Gamepad2,
  Laptop,
} from "lucide-react";

const categories = [
  { name: "Restauración", icon: Utensils },
  { name: "Alimentación", icon: ShoppingBasket },
  { name: "Moda", icon: Shirt },
  { name: "Salud y bienestar", icon: HeartPulse },
  { name: "Hogar", icon: House },
  { name: "Servicios", icon: Wrench },
  { name: "Ocio", icon: Gamepad2 },
  { name: "Tecnología", icon: Laptop },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
        {/* Header */}
        <header className="px-5 pb-4 pt-8">
          <h1 className="text-3xl font-bold tracking-tight">DeBarrio</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Descubre los comercios de tu zona
          </p>
        </header>

        {/* Search */}
        <section className="px-5">
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-100 px-4 py-3">
            <Search className="h-5 w-5 text-zinc-400" />

            <input
              type="text"
              placeholder="Buscar comercios..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </div>
        </section>

        {/* Categories */}
        <section className="mt-8 px-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Categorías</h2>

            <button className="text-sm font-medium text-zinc-500">
              Ver todas
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  key={category.name}
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-center transition hover:bg-zinc-50 active:scale-[0.98]"
                >
                  <Icon className="h-6 w-6 text-zinc-700" />

                  <span className="text-sm font-medium">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Nearby businesses */}
        <section className="mt-8 px-5 pb-28">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cerca de ti</h2>

            <button className="text-sm font-medium text-zinc-500">
              Ver todos
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-6 text-center">
            <Map className="mx-auto h-8 w-8 text-zinc-400" />

            <p className="mt-3 text-sm font-medium text-zinc-700">
              Próximamente
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Aquí aparecerán los comercios cercanos a tu ubicación.
            </p>
          </div>
        </section>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
            <button className="flex flex-col items-center gap-1 text-zinc-900">
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">Inicio</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-zinc-400">
              <Map className="h-5 w-5" />
              <span className="text-xs font-medium">Mapa</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-zinc-400">
              <Settings className="h-5 w-5" />
              <span className="text-xs font-medium">Ajustes</span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
// ESTO ES UNA VERSIÓN PARA VERLO EN LA WEB ANTES DE HACER LA MIGRACIÓN A EXPO, NO ES LA VERSIÓN FINAL.
