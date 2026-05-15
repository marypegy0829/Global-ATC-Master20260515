export default function Sim() {
  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
      <header className="mb-12 mt-4 md:mt-0">
        <h1 className="text-[2.2rem] md:text-5xl font-bold tracking-tight mb-4 text-gray-900 leading-tight">
          模拟演练
        </h1>
        <p className="text-[1.05rem] md:text-lg text-gray-500 leading-relaxed font-medium max-w-xl">
          沉浸式进近与塔台模拟器。体验多变气象条件下的超高密度航班流管控。
        </p>
      </header>
      
      <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 flex items-center justify-center">
        <p className="text-gray-400 font-semibold text-lg tracking-wide">
          演练场景初始化...
        </p>
      </div>
    </div>
  );
}
