interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showError: boolean;
  errorMessage: string;
  type?: "text" | "amount";
}

const TextInput = ({ label, value, onChange, showError, errorMessage, type }: TextInputProps) => {
  return (
    <div>
      <label>
        {label}: <br />
        <input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} />
        {showError && <div> {errorMessage} </div>}
      </label>
    </div>
  );
};

export default TextInput;
