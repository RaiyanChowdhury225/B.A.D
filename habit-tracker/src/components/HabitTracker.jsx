import { useEffect, useMemo, useState } from "react";

const createEmptyLog = () => ({
    date: new Date().toISOString().slice(0, 10),
    sleep: "",
    study: "",
    mood: "",
    stress: "",
    workout: "",
    water: "",
    focus: "",
    screenTime: "",
    notes: "",
});

function toNullableNumber(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function Habitform({ initialValues, onSubmit, onCancel, submitLabel = "Add Log" }) {
    const defaultValues = useMemo(() => createEmptyLog(), []);
    const [formValues, setFormValues] = useState(defaultValues);

    useEffect(() => {
        setFormValues({
            ...defaultValues,
            ...initialValues,
            date: initialValues?.date || defaultValues.date,
        });
    }, [defaultValues, initialValues]);

    const handleSubmit = (event) => {
        event.preventDefault();

        onSubmit({
            ...formValues,
            sleep: toNullableNumber(formValues.sleep),
            study: toNullableNumber(formValues.study),
            mood: toNullableNumber(formValues.mood),
            stress: toNullableNumber(formValues.stress),
            workout: toNullableNumber(formValues.workout),
            water: toNullableNumber(formValues.water),
            focus: toNullableNumber(formValues.focus),
            screenTime: toNullableNumber(formValues.screenTime),
            notes: formValues.notes?.trim() || "",
            timestamp: Date.parse(`${formValues.date}T12:00:00`),
        });

        if (!initialValues) {
            setFormValues(defaultValues);
        }
    };

    const handleChange = (key) => (event) => {
        setFormValues((current) => ({ ...current, [key]: event.target.value }));
    };

    return (
        <form className="habit-form" onSubmit={handleSubmit}>
            <label>
                Date
                <input type="date" value={formValues.date} onChange={handleChange("date")} />
            </label>

            <label>
                Sleep Hours
                <input type="number" placeholder="e.g. 7" value={formValues.sleep} min="0" max="24" onChange={handleChange("sleep")} />
            </label>

            <label>
                Study Hours
                <input type="number" placeholder="e.g. 3" value={formValues.study} min="0" max="24" onChange={handleChange("study")} />
            </label>

            <label>
                Mood (1-10)
                <input type="number" placeholder="How are you feeling?" value={formValues.mood} min="1" max="10" onChange={handleChange("mood")} />
            </label>

            <label>
                Stress (1-10)
                <input type="number" placeholder="How stressed are you?" value={formValues.stress} min="1" max="10" onChange={handleChange("stress")} />
            </label>

            <label>
                Workout (minutes)
                <input type="number" placeholder="e.g. 40" value={formValues.workout} min="0" max="400" onChange={handleChange("workout")} />
            </label>

            <label>
                Water Intake (liters)
                <input type="number" step="0.1" placeholder="e.g. 2.5" value={formValues.water} min="0" max="12" onChange={handleChange("water")} />
            </label>

            <label>
                Focus Quality (1-5)
                <input type="number" placeholder="e.g. 4" value={formValues.focus} min="1" max="5" onChange={handleChange("focus")} />
            </label>

            <label>
                Screen Time (hours)
                <input type="number" step="0.1" placeholder="e.g. 5.5" value={formValues.screenTime} min="0" max="24" onChange={handleChange("screenTime")} />
            </label>

            <label className="full-width-field">
                Notes (optional)
                <textarea placeholder="Any context for the day..." value={formValues.notes} onChange={handleChange("notes")} rows="3" />
            </label>

            <div className="form-actions">
                {onCancel ? (
                    <button type="button" className="ghost-button" onClick={onCancel}>
                        Cancel
                    </button>
                ) : null}
                <button type="submit" className="primary-button">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

export default Habitform;