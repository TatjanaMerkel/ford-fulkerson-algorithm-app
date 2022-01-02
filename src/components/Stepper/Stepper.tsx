import React from "react";


interface Props {
    maxSteps: number

    onCurrentStepChange: (currentStep: number) => void
}

interface State {
    currentStep: number
}

class Stepper extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            currentStep: 0
        }
    }

    goToStep(step: number) {
        this.setState({currentStep: step})
        this.props.onCurrentStepChange(step)
    }

    render() {
        return (
            <div id="stepper" className="ui-widget ui-background flex">
                <button onClick={() => this.goToStep(0)}>
                    &lt;&lt;
                </button>

                <button onClick={() => this.goToStep(Math.max(0, this.state.currentStep - 1))}>
                    &lt;
                </button>

                <span>
                    {this.state.currentStep} / {this.props.maxSteps}
                </span>

                <button onClick={() => this.goToStep(Math.min(this.props.maxSteps, this.state.currentStep + 1))}>
                    &gt;
                </button>

                <button onClick={() => this.goToStep(this.props.maxSteps)}>
                    &gt;&gt;
                </button>
            </div>
        )
    }

}

export default Stepper;
