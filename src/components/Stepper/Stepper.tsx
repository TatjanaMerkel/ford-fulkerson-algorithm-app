import React from "react";


interface Props {
    maxSteps: number
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

    render() {
        return (
            <div id="stepper" className="ui-widget ui-background flex">
                <button onClick={() => this.setState({currentStep: 0})}>&lt;&lt;</button>
                <button
                    onClick={() => this.setState({currentStep: this.state.currentStep === 0 ? 0 : this.state.currentStep - 1})}>&lt;</button>
                <span> {this.state.currentStep} / {this.props.maxSteps}</span>
                <button
                    onClick={() => this.setState(
                        {
                            currentStep: this.state.currentStep === this.props.maxSteps ?
                                this.props.maxSteps : this.state.currentStep + 1
                        })}>&gt;</button>
                <button onClick={() => this.setState({currentStep: this.props.maxSteps})}>&gt;&gt;</button>
            </div>
        )
    }

}

export default Stepper;
