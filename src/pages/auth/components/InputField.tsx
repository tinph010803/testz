import { FaUser, FaLock, FaPhone } from "react-icons/fa";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

interface InputFieldProps {
    type: string;
    name: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    showPassword?: boolean;
    onTogglePasswordVisibility?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
    type,
    name,
    placeholder,
    value,
    onChange,
    onKeyDown,
    showPassword,
    onTogglePasswordVisibility,
}: InputFieldProps) => {
    const renderIcon = () => {
        if (name === "phoneNumber") return <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        if (name === "username") return <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        return <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
    }

    return (
        <div className="relative mt-4">
            {renderIcon()}
            <input
                type={type === "password" && showPassword ? "text" : type}
                name={name}
                placeholder={placeholder}
                className={`w-full px-4 py-3 pl-10 bg-gray-800 text-white rounded-lg focus:outline-none
                    ${type === "password" ? "pr-10" : ""} `}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
            />
            {type === "password" && (
                <button
                    type="button"
                    onClick={onTogglePasswordVisibility}
                    className="absolute cursor-pointer right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
            )}
        </div>
    )
}

export default InputField;