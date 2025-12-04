type Props = {
  onClose?: () => void;
};

export default function CrisisBanner({ onClose }: Props) {
  return (
    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 flex justify-between gap-3">
      <div>
        <p className="font-semibold">You deserve immediate support 💛</p>
        <p className="mt-1">
          If you are thinking about harming yourself or feel in immediate danger, please
          contact local emergency services or a crisis hotline in your country. This app
          cannot handle emergencies.
        </p>
        <p className="mt-1 text-[10px] text-red-700">
          Examples: call emergency services (112 / 911) or a trusted crisis line, or reach out
          to a trusted person near you.
        </p>
      </div>
      {onClose && (
        <button
          className="self-start text-[10px] font-semibold text-red-500 hover:text-red-700"
          onClick={onClose}
        >
          ✕
        </button>
      )}
    </div>
  );
}
