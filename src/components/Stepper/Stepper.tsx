import React from "react";


interface Props {
    maxStep: number
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
            <div id="stepper" className="ui-widget ui-background flex" >
                <button onClick={() => this.goToStep(0)}>
                    &lt;&lt;
                </button>

                <button onClick={() => this.goToStep(Math.max(0, this.state.currentStep - 1))}>
                    &lt;
                </button>

                <span>
                    {this.state.currentStep + 1} / {this.props.maxStep + 1}
                </span>

                <button onClick={() => this.goToStep(Math.min(this.props.maxStep, this.state.currentStep + 1))}>
                    &gt;
                </button>

                <button onClick={() => this.goToStep(this.props.maxStep)}>
                    &gt;&gt;
                </button>
            </div>
        )
    }

}

export default Stepper;
