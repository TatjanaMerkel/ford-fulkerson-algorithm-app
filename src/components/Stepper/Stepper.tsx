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
        return(
            <div id="stepper" className="ui-widget ui-background flex">
                <button>&lt;&lt;</button>
                <button>&lt;</button>
                <span> {this.state.currentStep} / {this.props.maxSteps}</span>
                <button>&gt;</button>
                <button>&gt;&gt;</button>
            </div>
        )
    }

}

export default Stepper;
