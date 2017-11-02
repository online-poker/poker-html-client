import * as ko from "knockout";
import { TableSlider } from "../../js/table/tableSlider";

declare var global: any;

describe("tableSlider", function () {
    let tableSlider;
    beforeEach(function () {
        tableSlider = new TableSlider();
        tableSlider.setBounds(0, 200);
        let el = document.getElementById("stage");
        if (el == null) {
            el = document.createElement("div");
            el.id = "stage";
            document.body.appendChild(el);
        }

        el.innerHTML = ["<div class=\"slider-container\">",
                        "   <span class=\"min-bet-amount\" data-bind=\"text: minimum\"></span>",
                        "   <input class=\"bet-amount input-small\" type=\"text\"",
                        "       data-bind=\"value: current\" />",
                        "   <span class=\"max-bet-amount\" data-bind=\"text: maximum\"></span>",
                        "   <div class=\"slider\">",
                        "       <div class=\"slider-controls\">",
                        "           <span class=\"slider-move-left\"></span>",
                        "           <span class=\"slider-move-right\"></span>",
                        "       </div>",
                        "       <div class=\"slider-handle\"></div>",
                        "   </div>",
                        "</div>"].join("\n");
        ko.applyBindings(tableSlider, el.childNodes[0]);
    });
    it("increase should work", function () {
        tableSlider.setParameters(0, 20, 0, 100);
        tableSlider.increase();
        expect(tableSlider.current()).toEqual(20);
        expect(tableSlider.position()).toEqual(40);
    });
    it("decrease should work", function () {
        tableSlider.setParameters(50, 20, 0, 100);
        tableSlider.decrease();
        expect(tableSlider.current()).toEqual(30);
        expect(tableSlider.position()).toEqual(60);
    });
    it("decrease below minimal should set minimum", function () {
        tableSlider.setParameters(10, 20, 0, 100);
        tableSlider.decrease();
        expect(tableSlider.current()).toEqual(0);
        expect(tableSlider.position()).toEqual(0);
    });
    it("increase above max should set max", function () {
        tableSlider.setParameters(100, 20, 0, 100);
        tableSlider.increase();
        expect(tableSlider.current()).toEqual(100);
        expect(tableSlider.position()).toEqual(200);
    });
});
