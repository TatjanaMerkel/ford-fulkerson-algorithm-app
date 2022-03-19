import React from "react";
import './Stepper.css'

interface Props {
    stepCount: number
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
            <div id="stepper" className="widget widget-bg flex">
                <button onClick={() => this.goToStep(0)}
                        disabled={this.state.currentStep === 0}>
                    &lt;&lt;
                </button>

                <button onClick={() => this.goToStep(Math.max(0, this.state.currentStep - 1))}
                        disabled={this.state.currentStep === 0}>
                    &lt;
                </button>

                <span>
                    {this.state.currentStep + 1} / {this.props.stepCount}
                </span>

                <button onClick={() => this.goToStep(Math.min(this.props.stepCount, this.state.currentStep + 1))}
                        disabled={this.state.currentStep === this.props.stepCount - 1}>
                    &gt;
                </button>

                <button onClick={() => this.goToStep(this.props.stepCount - 1)}
                        disabled={this.state.currentStep === this.props.stepCount - 1}>
                    &gt;&gt;
                </button>
            </div>
        )
    }

}

export default Stepper;
